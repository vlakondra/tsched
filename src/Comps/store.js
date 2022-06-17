import { readable,writable } from 'svelte/store';

//часы для header'a
export const time = readable(new Date(), function start(set) {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return function stop() {
        console.log('STOP??? ')
		clearInterval(interval);
	};
});


export const load_ini_data= writable(false)
export const load_sched_data= writable(false)

export const err_ini_data= writable(false)
export const err_sched_data= writable(false)

export const depart_id = writable(null)
export const teacher_id = writable(null)

export const d_start = writable(null)
export const d_end = writable(null)
export const  scheddata=writable({})
export const sched_data_loaded=writable(false) //была  загрузка расписания - не показ-ть startmessage



const esc = encodeURIComponent;
const buildparams =(pars)=>{
    console.log('from build')
     Object.keys(pars)
    .map((k) => `${esc(k)}=${esc(pars[k])}`)
    .join("&");
}
//загрузка данных по кафедрам. импортируется depart.svelte
export default function (){
    const url = "https://old.ursei.su/Services/GetTeachersIniData?";
    const params = {
      //почему работает с любой датой?
      d: new Date().toISOString().slice(0, 10),
    };
    let query = buildparams(params)
    // const query = Object.keys(params)
    //   .map((k) => `${esc(k)}=${esc(params[k])}`)
    //   .join("&");

    const loading = writable(true) //оставить только data и export-переменные
    const error = writable(false)
	const data = writable({})  
   

    async function get() {
        loading.set(true)
        error.set(false)
        load_ini_data.set(true)
        try {
            const response = await fetch(url + query)
            data.set(await response.json())
        } catch(e) {
            error.set(e)
            err_ini_data.set(e)
        }
        loading.set(false)
        load_ini_data.set(false)
    }

    get()

    return [loading, error,data];
}

export async function getSched(par){
    let dstart,dend,departid,empid;

    d_start.subscribe((v)=>dstart=new Date(v).toLocaleDateString('ru-RU'))
    d_end.subscribe((v)=>dend=new Date(v).toLocaleDateString('ru-RU'))
    depart_id.subscribe((v)=>departid=v)
    teacher_id.subscribe((v)=>empid=v)

    load_sched_data.set(true)
    const url='https://old.ursei.su/Services/GetTeacherSched?'
    const params = {
        departid:departid,
        empid:empid,
        dstart:dstart,
        dend:dend
      };
    //    let query = buildparams(params)
      const query = Object.keys(params)
      .map((k) => `${esc(k)}=${esc(params[k])}`)
      .join("&");

      try {
        const response = await fetch(url + query)
        let v = await response.json()
        // console.log(v)
        scheddata.set(v)  //await response.json())
        sched_data_loaded.set(true)

        setTimeout(() => {
            let dp = document.getElementById(
                new Date().toISOString().slice(0, 10)
            );
            console.log('DP', dp)
            if (dp) {
                dp.scrollIntoView({ block: "start", behavior: "smooth" });
            }else {
                document.body.scrollIntoView();
            }
        }, 500);



        
    } catch(e) {
        err_sched_data.set(e)
        // error.set(e)
        // err_ini_data.set(e)
    }
    load_sched_data.set(false)

}






