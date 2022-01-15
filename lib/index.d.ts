import { QueryInterface } from 'sequelize';
declare type Options = {
    getPrimaryKey?: (primaryTable: string) => string;
};
export declare const queryInterfaceDecorator: (queryInterface: QueryInterface, options?: Options | undefined) => QueryInterface;
export {};
