import { intlFormat,parse,lightFormat } from "date-fns";

// import {TableToExcel} from "@linways/table-to-excel";
// import {TableToExcel} from "@linways/table-to-excel/dist/tableToExcel.js";

export const isToday = ( pairdate)=>{
    const today = intlFormat(new Date(), { locale: "ru-RU" });
    return  pairdate ===today
}

export const toEnDate=(pairdate)=>{
   let en= parse(pairdate, 'dd.MM.yyyy', new Date()) 
   return lightFormat(en, 'yyyy-MM-dd')
}

export const  timepairs = {
    1: "08:30",
    2: "10:15",
    3: "12:00",
    4: "14:05",
    5: "15:50",
    6: "17:35",
    7: "19:15",
    8: "20:55",
};
