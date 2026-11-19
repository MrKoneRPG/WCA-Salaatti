import type { planPosition } from "./planPosition"

export type plan = 
{
    id?: number
    name: string
    cartId: string
    positions: planPosition[]
}