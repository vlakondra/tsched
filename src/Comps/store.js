import { readable,writable } from 'svelte/store';

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
export const err_ini_data= writable(false)

export default function (){
    const url = "https://old.ursei.su/Services/GetTeachersIniData?";
    const params = {
      //почему работает с любой датой?
      d: new Date().toISOString().slice(0, 10),
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map((k) => `${esc(k)}=${esc(params[k])}`)
      .join("&");


    const loading = writable(true)
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


// export function getSched() {

//     const get_sched= ()=>{
//         console.log('????????')
//      ttt.set({a:123})
//     }
//        console.log('got a subscriber');
//     //set("кафедры!!")
//     return get_sched;
// };





