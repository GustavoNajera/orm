////////////////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)                                                                  //
//                                                                                        //
// Copyright (C) 2018  Unicoderns S.A. - info@unicoderns.com - unicoderns.com             //
//                                                                                        //
// Permission is hereby granted, free of charge, to any person obtaining a copy           //
// of this software and associated documentation files (the "Software"), to deal          //
// in the Software without restriction, including without limitation the rights           //
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell              //
// copies of the Software, and to permit persons to whom the Software is                  //
// furnished to do so, subject to the following conditions:                               //
//                                                                                        //
// The above copyright notice and this permission notice shall be included in all         //
// copies or substantial portions of the Software.                                        //
//                                                                                        //
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR             //
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,               //
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE            //
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER                 //
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,          //
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE          //
// SOFTWARE.                                                                              //
////////////////////////////////////////////////////////////////////////////////////////////

import { Config, Drivers, ORMModelQuery, Engines } from '../interfaces'
import { ParamCursor } from '../utils/paramCursor'
import { regularQuotes } from '../utils/defaultValues'

/**
 * Model Abstract
 */
export abstract class Statement {
    public config: Config = {}
    protected regularQuotes = '"'
    protected paramCursor: ParamCursor = new ParamCursor()
    protected error = ''
    protected abstract template: string
    protected abstract templateJoin: string
    protected abstract templateWhere: string
    protected abstract templateJoinWhere: string

    /**
     * Set model
     *
     * @param model ORMModel
     * @param config Config
     */
    constructor(config: Config) {
        this.config = config
    }

    /**
     * Quote string
     */
    protected quote(value: string): string {
        return regularQuotes + value + regularQuotes
    }

    public query(query: ORMModelQuery): ORMModelQuery {
        const { values, parameters, fields } = query
        let { sql } = query

        if (this.config.engine === Engines.MySQL) {
            sql = sql.replace(/"/g, '`')
        }

        if (this.config.driver === Drivers.DataAPI) {
            return { sql, parameters, fields }
        } else {
            return { sql, values, fields }
        }
    }

    private getTemplate({ join, conditions }: { join?: string; conditions?: string }): string {
        if (conditions && join) {
            return this.templateJoinWhere
        } else if (conditions) {
            return this.templateWhere
        } else if (join) {
            return this.templateJoin
        } else {
            return this.template
        }
    }

    protected strToReplace(item: string): string {
        if (this.config.driver === Drivers.DataAPI) {
            return `:${item}`
        } else if (this.config.engine === Engines.PostgreSQL) {
            return `$${this.paramCursor.getNext()}`
        } else if (this.config.engine === Engines.MySQL) {
            return '?'
        } else {
            throw new Error('ENGINE NOT SUPPORTED')
        }
    }

    protected assembling({
        tableName,
        fields,
        values,
        join,
        conditions,
        extra,
    }: {
        tableName: string
        fields?: string
        values?: string
        join?: string
        conditions?: string
        extra?: string
    }): string {
        let query = this.getTemplate({ join, conditions })

        query = query.replace('<orm_column_names>', fields || '')
        query = query.replace('<orm_table_name>', tableName || '')
        query = query.replace('<orm_conditions>', conditions || '')
        query = query.replace('<orm_value_keys>', values || '')
        query = query.replace('<orm_join>', join || '')
        return query.replace('<orm_extra>', extra || '')
    }
}
