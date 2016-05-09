import {PropertyMetadata} from "./PropertyMetadata";
import {RelationTypes, RelationType} from "./types/RelationTypes";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";
import {EntityMetadata} from "./EntityMetadata";
import {OnDeleteType} from "./ForeignKeyMetadata";
import {JoinTableMetadata} from "./JoinTableMetadata";
import {JoinColumnMetadata} from "./JoinColumnMetadata";
import {RelationMetadataArgs} from "./args/RelationMetadataArgs";
import {ColumnMetadata} from "./ColumnMetadata";

/**
 * Function that returns a type of the field. Returned value must be a class used on the relation.
 */
export type RelationTypeInFunction = ((type?: any) => Function);

/**
 * Contains the name of the property of the object, or the function that returns this name.
 */
export type PropertyTypeInFunction<T> = string|((t: T) => string|any);


/**
 * This metadata interface contains all information about some document's relation.
 */
export class RelationMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize column name.
     */
    namingStrategy: NamingStrategyInterface;

    /**
     * Its own entity metadata.
     */
    entityMetadata: EntityMetadata;

    /**
     * Related entity metadata.
     */
    inverseEntityMetadata: EntityMetadata;

    /**
     * Junction entity metadata.
     */
    junctionEntityMetadata: EntityMetadata;

    /**
     * Join table metadata.
     */
    joinTable: JoinTableMetadata;

    /**
     * Join column metadata.
     */
    joinColumn: JoinColumnMetadata;
    
    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Relation type.
     */
    readonly relationType: RelationType;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    readonly isCascadeInsert: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    readonly isCascadeUpdate: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    readonly isCascadeRemove: boolean;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    readonly isNullable: boolean = true;

    /**
     * Old column name.
     */
    readonly oldColumnName: string;

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    readonly onDelete: OnDeleteType;

    /**
     * The real reflected property type.
     */
    readonly propertyType: any;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Column name for this relation.
     */
    private _name: string;

    /**
     * The type of the field.
     */
    private _type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    private _inverseSideProperty: PropertyTypeInFunction<any>;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: RelationMetadataArgs) {
        super(args.target, args.propertyName);
        this.relationType = args.relationType;
        this._inverseSideProperty = args.inverseSideProperty;

        if (args.options.name)
            this._name = args.options.name;
        if (args.propertyType)
            this.propertyType = args.propertyType;
        if (args.options.cascadeInsert || args.options.cascadeAll)
            this.isCascadeInsert = true;
        if (args.options.cascadeUpdate || args.options.cascadeAll)
            this.isCascadeUpdate = true;
        if (args.options.cascadeRemove || args.options.cascadeAll)
            this.isCascadeRemove = true;
        if (args.options.oldColumnName)
            this.oldColumnName = args.options.oldColumnName;
        if (args.options.nullable)
            this.isNullable = args.options.nullable;
        if (args.options.onDelete)
            this.onDelete = args.options.onDelete;

        if (!this._type)
            this._type = args.type;
        if (!this._name)
            this._name = args.propertyName;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    get name(): string {
        if (this.joinColumn && this.joinColumn.name)
            return this.joinColumn.name;
        
        return this.namingStrategy ? this.namingStrategy.relationName(this._name) : this._name;
    }

    /**
     * Indicates if this side is an owner of this relation.
     */
    get isOwning() {
        return  this.isManyToOne || 
                (this.isManyToMany && this.joinTable) || 
                (this.isOneToOne && this.joinColumn);
    }

    get type(): Function {
        return this._type();
    }

    get inverseSideProperty(): string {
        return this.computeInverseSide(this._inverseSideProperty);
    }

    get inverseRelation(): RelationMetadata {
        return this.inverseEntityMetadata.findRelationWithPropertyName(this.computeInverseSide(this._inverseSideProperty));
    }

    get isOneToOne(): boolean {
        return this.relationType === RelationTypes.ONE_TO_ONE;
    }

    get isOneToMany(): boolean {
        return this.relationType === RelationTypes.ONE_TO_MANY;
    }

    get isManyToOne(): boolean {
        return this.relationType === RelationTypes.MANY_TO_ONE;
    }

    get isManyToMany(): boolean {
        return this.relationType === RelationTypes.MANY_TO_MANY;
    }
    
    get hasInverseSide(): boolean {
        return this.inverseEntityMetadata && !!this.inverseRelation;
    }
    
    get isLazy(): boolean {
        return this.propertyType && this.propertyType.name && this.propertyType.name.toLowerCase() === "promise";
    }

    // ---------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------

    private computeInverseSide(inverseSide: PropertyTypeInFunction<any>): string {
        const ownerEntityPropertiesMap = this.inverseEntityMetadata.createPropertiesMap();
        if (typeof inverseSide === "function")
            return (<Function> inverseSide)(ownerEntityPropertiesMap);
        if (typeof inverseSide === "string")
            return <string> inverseSide;

        // throw new Error("Cannot compute inverse side of the relation");
        return "";
    }

}