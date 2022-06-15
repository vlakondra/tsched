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

const depart_url="https://old.ursei.su/Services/GetTeachersIniData?";



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
        try {
            const response = await fetch(url+query)
            data.set(await response.json())
        } catch(e) {
            error.set(e)
        }
        loading.set(false)
    }
    get()


    return [loading, error,data];
}

// export const depart = readable(undefined, (set) => {
//     const loading = writable(false)
// 	const error = writable(false)
// 	const data = writable({})

//     console.log('got a subscriber');
//     //set("кафедры!!")
//     return [loading, error,data,  function stop(){ console.log('no more subscribers')}];
// });


