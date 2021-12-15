import {validateCompare} from "../validation/validation";
import {all} from "../logging";
import {constructFromObject, Model, ModelErrorDefinition} from "@tvenceslau/decorator-validation/lib";

/**
 * Abstract class representing a Validatable DBModel object
 *
 * @see Model
 *
 * @class DBModel
 * @abstract
 * @extends Model
 *
 */
export default abstract class DBModel extends Model {
    [indexer: string]: any;

    constructor(dbModel?: DBModel | {}){
        super();
        constructFromObject(this, dbModel);
    }

    /**
     * @param {DBModel | any} [previousVersion] validates an update via the {@link DBModel} decorators
     * @param {any[]} [exclusions] {@see Model#hasErrors}
     * @return {ModelErrorDefinition | undefined}
     */
    hasErrors(previousVersion?: DBModel | any, ...exclusions: any[]): ModelErrorDefinition | undefined {
        if (previousVersion && !(previousVersion instanceof DBModel)){
            exclusions.unshift(previousVersion);
            previousVersion = undefined;
        }

        let errs = super.hasErrors(...exclusions);
        if (!previousVersion)
            return errs;

        all(`Now comparing ${previousVersion.toString()} with ${this.toString()}`);
        return validateCompare(previousVersion, this, ...exclusions);
    }
}
