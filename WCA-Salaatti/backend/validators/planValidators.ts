//import type { Pool, RowDataPacket } from "mysql2/promise";
import type { plan } from "../../src/types/plan";
//type Pool = ReturnType<typeof mysql.createPool>;
export type ValidationResult = {
 valid: boolean;
 errors: string[];   
};

export async function validatePlan(plan: plan, pool: any):
Promise<ValidationResult> {
const errors: string[] = [];

if(!plan.name?.trim()){
    errors.push("Plan name cannot be empty");
}

const [cartRows] = await pool.execute(
    "SELECT capacity FROM carts WHERE id = ?",
    [plan.cartId]
);

if(cartRows.length === 0){
    errors.push("Unknown cart");
}
else
{
    const capacity = Number(cartRows[0].capacity);

    const usedPosition = new Set<number>();

    for (const position of plan.positions)
    {
        if(!Number.isInteger(position.positionNumber))
        {
            errors.push(
                `Position ${position.positionNumber} must be and integer`
            );
        }
            if(
            position.positionNumber < 1 || 
            position.positionNumber > capacity)
            {
                errors.push(
                    `Position ${position.positionNumber} is outside cart capacity`
                );
            }
            if(usedPosition.has(position.positionNumber))
            {
                errors.push(
                    `Duplicate position number ${position.positionNumber}`
                );
            }
            usedPosition.add(position.positionNumber);

    }
}

for(const position of plan.positions)
{
    if (position.productId === null)
    {
        continue;
    }

    const [products] = await pool.execute(
        "SELECT id FROM products WHERE id = ?",
        [position.productId]
    );
    if (products.length === 0)
    {
        errors.push(
            `Unknown product id ${position.productId}`
        );
    }
}
    return{
        valid: errors.length === 0,
        errors,
    };
}