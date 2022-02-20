let db;
const request = indexedDB.open("save_the_steer", 1);

// if db version is updated, update with new store
request.onupgradeneeded = function (event) {
	const db = event.target.result;
	db.createObjectStore("new_budget", { autoIncrement: true });
};

// on successful creation of object store
request.onsuccess = function (event) {
	db = event.target.result;

	// if connection restored, upload budget
	if (navigator.online) {
		uploadBudget();
	}
};

// on unsuccessful creation of object store
request.onerror = function (event) {
	console.log(event.target.errorCode);
};

// executed when trying to submit a budget with no internet
function saveRecord(record) {
	const transaction = db.transaction(["new_budget"], "readwrite");

	const budgetObjectStore = transaction.objectStore("new_budget");

	// add record to object store
	budgetObjectStore.add(record);
}

// upload stored objects to network when back online
function uploadBudget() {
	const transaction = db.transaction(["new_budget"], "readwrite");

	// access object store
	const budgetObjectStore = transaction.objectStore("new_budget");

	// get all records from the store
	const getAll = budgetObjectStore.getAll();

	getAll.onsuccess = function () {
		// if data in indexedDB store, send to bulk insert in api server
		if (getAll.result.length > 0) {
			fetch("/api/transaction/bulk", {
				method: "POST",
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
				.then((response) => response.json())
				.then((serverResponse) => {
					if (serverResponse.message) {
						throw new Error(serverResponse);
					}
					// clear the objectStore once uploaded
					const transaction = db.transaction(["new_budget"], "readwrite");
					const budgetObjectStore = transaction.objectStore("new_budget");
					budgetObjectStore.clear();

					alert("All saved budgets have been uploaded!");
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};
}

// when app comes back online, upload budget saved to indexedDB
window.addEventListener("online", uploadBudget);
