import { intlFormat,parse,lightFormat } from "date-fns";

export const isToday = ( pairdate)=>{
    const today = intlFormat(new Date(), { locale: "ru-RU" });
    return  pairdate ===today
}

export const toEnDate=(pairdate)=>{
   let en= parse(pairdate, 'dd.MM.yyyy', new Date()) 
   return lightFormat(en, 'yyyy-MM-dd')
}
