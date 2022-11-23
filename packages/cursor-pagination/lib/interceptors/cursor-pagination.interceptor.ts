import { Knex } from 'knex';
import {
  addPrefixColumn,
  DatabaseOptions,
  KnexionCallHandler,
  KnexionExecutionContext,
  KnexionInterceptor,
} from '@knexion/core';
import { map, Observable } from 'rxjs';
import {
  ListPaginationSelectDatabaseOptions,
  PageInfo,
  PageList,
  ComparisonOperator,
  CursorPaginationOptions,
} from '../interfaces';
import { getSortDirection } from '@knexion/sort';

export class CursorPaginationInterceptor<
  TRecord,
  TResult,
  IdType extends string | number,
> implements KnexionInterceptor<TRecord, TResult, TResult[], PageList<TResult>>
{
  constructor(private readonly options?: CursorPaginationOptions) {}

  public intercept(
    context: KnexionExecutionContext<TRecord>,
    next: KnexionCallHandler<TResult[]>,
  ): Observable<PageList<TResult>> {
    const queryBuilder = context.switchToKnex().getQueryBuilder();
    const {
      limit = this.options?.defaultLimit ?? 20,
      page_after,
      page_before,
      alias,
      ...options
    } = context
      .switchToKnex()
      .getOptions<ListPaginationSelectDatabaseOptions<TRecord, TResult>>() ??
    {};
    const sort = this.extractSortArray(options);

    queryBuilder.limit(limit + 1);
    if (page_after) {
      const pageInfo = this.parsePageInfo(page_after);
      queryBuilder.where((builder) =>
        this.buildCursorQuery(builder, [...sort], pageInfo, alias, true),
      );
      queryBuilder
        .orderBy(addPrefixColumn('created_at', alias), 'desc')
        .orderBy(addPrefixColumn('id', alias), 'asc');
    } else if (page_before) {
      const pageInfo = this.parsePageInfo(page_before);
      queryBuilder.where((builder) =>
        this.buildCursorQuery(builder, [...sort], pageInfo, alias, false),
      );
      queryBuilder
        .orderBy(addPrefixColumn('created_at', alias), 'asc')
        .orderBy(addPrefixColumn('id', alias), 'desc');
    } else {
      queryBuilder
        .orderBy(addPrefixColumn('created_at', alias), 'desc')
        .orderBy(addPrefixColumn('id', alias), 'asc');
    }

    return next.handle().pipe(
      map((data) => {
        let hasMoreNext = data.length > limit;
        let hasMorePrevious = false;
        if (hasMoreNext) {
          data.pop();
        }
        if (page_after) {
          hasMorePrevious = true;
        }
        if (page_before) {
          data.reverse();
          hasMorePrevious = hasMoreNext;
          hasMoreNext = true;
        }
        return {
          data,
          has_more_next: hasMoreNext,
          has_more_previous: hasMorePrevious,
        };
      }),
    );
  }

  private buildCursorQuery(
    builder: Knex.QueryBuilder<TRecord, TResult>,
    sort: string[],
    pageInfo: PageInfo<IdType>,
    alias: string,
    next?: boolean,
  ): void {
    const sortProperty = sort.shift();
    if (!sortProperty) {
      builder
        .where(
          addPrefixColumn('created_at', alias),
          next ? '<=' : '>=',
          pageInfo.created_at,
        )
        .andWhere((andWhereBuilder) =>
          andWhereBuilder
            .where(
              addPrefixColumn('created_at', alias),
              next ? '<' : '>',
              pageInfo.created_at,
            )
            .orWhere(
              addPrefixColumn('id', alias),
              next ? '>' : '<',
              pageInfo.id,
            ),
        );
      return;
    }
    return this.buildSortCursorQuery(
      builder,
      sort,
      sortProperty,
      pageInfo,
      alias,
      next,
    );
  }

  private buildSortCursorQuery(
    builder: Knex.QueryBuilder<TRecord, TResult>,
    sort: string[],
    currentSortProperty: string,
    pageInfo: PageInfo<IdType>,
    alias: string,
    next?: boolean,
  ): void {
    const [dir, column] = getSortDirection(currentSortProperty);
    const lastSortValue = pageInfo[column];
    const isNullLastSortValue = lastSortValue === null;
    if (isNullLastSortValue) {
      builder.whereNull(column);
    } else {
      builder.where(
        column,
        this.getWhereSortOperator(dir, next),
        lastSortValue,
      );
    }
    builder.andWhere((andWereBuilder) => {
      if (!isNullLastSortValue) {
        andWereBuilder.where(
          column,
          this.getAndWhereSortOperator(dir, next),
          lastSortValue,
        );
      }
      andWereBuilder.orWhere((orWhereBuilder) =>
        this.buildCursorQuery(orWhereBuilder, sort, pageInfo, alias, next),
      );
    });
  }

  private getWhereSortOperator(
    dir: 'asc' | 'desc',
    next?: boolean,
  ): ComparisonOperator {
    if (dir === 'asc') {
      return next ? '>=' : '<=';
    }
    return next ? '<=' : '>=';
  }

  private getAndWhereSortOperator(
    dir: 'asc' | 'desc',
    next?: boolean,
  ): ComparisonOperator {
    if (dir === 'asc') {
      return next ? '>' : '<';
    }
    return next ? '<' : '>';
  }

  private parsePageInfo(pageInfo: string): PageInfo<IdType> {
    return JSON.parse(Buffer.from(pageInfo, 'base64').toString('ascii'));
  }

  private extractSortArray(
    options: DatabaseOptions<TRecord, TResult>,
  ): string[] {
    const sort = options[this.options?.sortOptionKey ?? 'sort'];
    if (Array.isArray(sort)) {
      return sort;
    }
    return [];
  }
}
