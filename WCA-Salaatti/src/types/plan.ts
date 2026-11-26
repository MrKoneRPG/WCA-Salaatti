import type { planPosition } from "./planPosition.js"

export type plan = 
{
    id?: number
    name: string
    cartId: string
    positions: planPosition[]
}