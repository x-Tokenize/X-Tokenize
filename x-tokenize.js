#!/usr/bin/env node

import {menuHandler} from "./src/menu/menuHandler.js"
import {menu} from './src/menu/menu.js'
import { getStartUpMenu } from "./src/menu/getStartupMenu.js"
import {acknowledgeTaC} from "./src/config/misc/acknowledgeTaC.js"

const main = async ()=>{
    try
    {
        await acknowledgeTaC()
        let startupMenu = await getStartUpMenu()
        await menuHandler(menu,startupMenu)
    }
    catch(e){
        console.log(e)
    }
}

main()
