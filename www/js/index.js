document.addEventListener('deviceready', onDeviceReady, false);

let push_id_array = []; //store latest pushes

function onDeviceReady() {
	console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
	document.getElementById('deviceready').classList.add('ready');

	cordova.plugins.notification.local.hasPermission(checkNotificationPermissions);

	function checkNotificationPermissions(granted) {
		if(granted) {
			//sendNotification("Notifications", "notifications ready!");
		} else {
			cordova.plugins.notification.local.requestPermission(function (granted) {
				if(granted) {
					//sendNotification("Notifications", "notifications granted permissions!");
				}
			});
		}
	}

	function sendNotification(title, message) {
		cordova.plugins.notification.local.schedule({
			title: title,
			text: message,
			foreground: true
		});
	}

	//Start the notification service
	(async ()=>{
		console.log("Start notification service");
		var BackgroundFetch = window.BackgroundFetch;

		var onEvent = async function(task_id) {
			var d = new Date();
			console.log(`[BackgroundFetch] ${task_id} event received at | ${d.getMinutes()}:${d.getSeconds()}`);
			await getLatestPushes();
			BackgroundFetch.finish(task_id);
		};
	
		var onTimeout = async function(task_id) {
			console.log('[BackgroundFetch] TIMEOUT: ', task_id);
			BackgroundFetch.finish(task_id);
		};
	
		var status = await BackgroundFetch.configure({	//delay: 5000,
														forceAlarmManager: true,
														stopOnTerminate: false,
														startOnBoot: true,
														minimumFetchInterval: 1
													},
														onEvent,
														onTimeout);
		console.log('[BackgroundFetch] configure status: ', status);

		/*BackgroundFetch.scheduleTask({
			taskId: 'cordova-background-fetch',
			delay: 5000,       // milliseconds
			forceAlarmManager: true,
			stopOnTerminate: false,
			startOnBoot: true,
			periodic: false
		});*/
	})();

	async function getLatestPushes(task_id) {
		document.querySelector('#json_log').innerHTML = "Calling for json";
		try{
			const response = await fetch(`https://falldeaf.xyz/getpushes/HVaMfGkqxUUx7JMQ5QK5uQ2RrXxN4fLxwLwbwCzd/latest`);
			document.querySelector('#json_log').innerHTML = response.responseText;
			const pushes = await response.json();
			for (const push of pushes) {
				if(!push_id_array.includes(push._id)) {
					switch(push.type) {
						case "message":
							//sendNotif(push.title, push.message);
							sendNotification(push.title, push.message);
							break;
						case "command":
							runCommand(push);
							break;
					}
					console.log("New push! : " + push.message);
					
					push_id_array.push(push._id);
					if(push_id_array.length > 50) push_id_array.pop();
				}
			}
		}
		catch (e) {
			document.querySelector('#json_log').innerHTML = response.responseText;
			console.log(e)
		}
	}

	document.querySelector('#json_log').innerHTML = "JSON Here";
	//window.setInterval(getLatestPushes, 4000);
}
