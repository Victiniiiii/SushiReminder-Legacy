document.getElementById("createReminderBtn").addEventListener("click", () => {
	document.getElementById("reminderModal").style.display = "block";
});

function closeModal() {
	document.getElementById("reminderModal").style.display = "none";
}

function openTab(evt, tabName) {
	const tabContent = document.getElementsByClassName("tab-content");
	for (let i = 0; i < tabContent.length; i++) {
		tabContent[i].style.display = "none";
	}
	document.getElementById(tabName).style.display = "block";
}

function saveReminder() {
	const reminderName = document.getElementById("reminderName").value;
	const reminderCategory = document.getElementById("reminderCategory").value;
	const reminderDate = document.getElementById("reminderDate").value;

	// Read and update the reminders.json file
	const fs = require("fs");
	const remindersPath = "./reminders.json";
	let reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));

	const newReminder = {
		name: reminderName,
		category: reminderCategory,
		date: reminderDate,
		remainingTime: calculateRemainingTime(reminderDate),
	};

	reminders.push(newReminder);
	fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));

	closeModal();
	// Refresh reminders display (optional)
}

function calculateRemainingTime(date) {
	const targetDate = new Date(date);
	const now = new Date();
	const diff = targetDate - now;
	const minutes = Math.floor(diff / 1000 / 60);
	return `${minutes} minutes remaining`;
}

document.getElementById("reminderCategory").addEventListener("change", (e) => {
	const reminderRepeat = document.getElementById("reminderRepeat");
	if (e.target.value === "repeated") {
		reminderRepeat.disabled = false;
	} else {
		reminderRepeat.disabled = true;
	}
});
