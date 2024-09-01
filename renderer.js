const fs = require("fs");
const path = require("path");
const remindersPath = path.join(__dirname, "reminders.json");

document.addEventListener("DOMContentLoaded", () => {
	loadReminders();
	document.querySelector(".tab-button").click();
	document.getElementById("createReminderBtn").addEventListener("click", showModal);
	document.querySelector(".close").addEventListener("click", closeModal);
	document.getElementById("settingsBtn").addEventListener("click", () => openTab(event, "settings"));
	document.getElementById("saveReminderBtn").addEventListener("click", saveReminder);
	document.getElementById("reminderCategory").addEventListener("change", toggleDateTime);
});

function validateReminder(name, category, date, time, daysOfWeek) {
	if (!name) {
		alert("Reminder name is required.");
		return false;
	}

	if (category === "one-time") {
		if (!date || !time) {
			alert("Date and time are required for one-time reminders.");
			return false;
		}
	} else if (category === "repeated") {
		if (daysOfWeek.length === 0) {
			alert("At least one day must be selected for repeated reminders.");
			return false;
		}
		if (!time) {
			alert("Time is required for repeated reminders.");
			return false;
		}
	}

	return true;
}

function loadReminders() {
	let reminders = [];
	try {
		reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
	} catch (error) {
		console.error("Error reading reminders:", error);
	}

	const oneTimeContainer = document.getElementById("oneTimeReminders");
	const repeatedContainer = document.getElementById("repeatedReminders");

	oneTimeContainer.innerHTML = "";
	repeatedContainer.innerHTML = "";

	reminders.forEach((reminder, index) => {
		const reminderElement = document.createElement("div");
		reminderElement.id = `reminder-${reminder.name}`;
		reminderElement.dataset.date = reminder.date;
		reminderElement.dataset.name = reminder.name;
		reminderElement.dataset.category = reminder.category;
		reminderElement.dataset.days = reminder.daysOfWeek ? reminder.daysOfWeek.join(",") : null;
		reminderElement.dataset.repeatedTime = reminder.repeatedTime || ""; // Assign repeatedTime

		const deleteButton = document.createElement("button");
		deleteButton.textContent = "Delete";
		deleteButton.className = "delete-button";
		deleteButton.onclick = () => deleteReminder(index);

		const reminderText = document.createElement("span");
		if (reminder.category === "repeated") {
			reminderText.textContent = `${reminder.name} - ${calculateRemainingTimeForRepeated(reminder.daysOfWeek, reminder.repeatedTime)}`;
		} else {
			reminderText.textContent = `${reminder.name} - ${calculateRemainingTime(reminder.date)}`;
		}

		reminderElement.appendChild(deleteButton);
		reminderElement.appendChild(reminderText);

		if (reminder.category === "one-time") {
			oneTimeContainer.appendChild(reminderElement);
		} else if (reminder.category === "repeated") {
			repeatedContainer.appendChild(reminderElement);
		}
	});

	setInterval(updateRemainingTimes, 1000);
}

function saveReminder() {
	const reminderName = document.getElementById("reminderName").value;
	const reminderCategory = document.getElementById("reminderCategory").value;
	const reminderDate = document.getElementById("reminderDate").value;
	const reminderDateTime = document.getElementById("reminderDateTime").value;
	const reminderRepeatedTime = document.getElementById("reminderRepeatedTime").value;

	let daysOfWeek = [];
	if (reminderCategory === "repeated") {
		const checkboxes = document.querySelectorAll('input[name="days"]:checked');
		checkboxes.forEach((checkbox) => {
			daysOfWeek.push(checkbox.value);
		});
	}

	if (!validateReminder(reminderName, reminderCategory, reminderDate, reminderDateTime, daysOfWeek)) {
		return;
	}

	const newReminder = {
		name: reminderName,
		category: reminderCategory,
		date: reminderCategory === "one-time" ? `${reminderDate}T${reminderDateTime}` : null,
		daysOfWeek: reminderCategory === "repeated" ? daysOfWeek : null,
		repeatedTime: reminderCategory === "repeated" ? reminderRepeatedTime : null,
	};

	// Save the reminder to the file
	let reminders = [];
	try {
		reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
	} catch (error) {
		console.error("Error reading reminders:", error);
	}

	reminders.push(newReminder);
	fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));

	closeModal();
	loadReminders();
}

function calculateRemainingTime(date) {
	const targetDate = new Date(date);
	const now = new Date();
	const diff = targetDate - now;

	if (diff <= 0) return "Time's up!";

	const totalSeconds = Math.floor(diff / 1000);
	const days = Math.floor(totalSeconds / (24 * 3600));
	const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	let remainingTime = "";
	if (days > 0) remainingTime += `${days} days `;
	if (hours > 0 || days > 0) remainingTime += `${hours} hours `;
	if (minutes > 0 || hours > 0 || days > 0) remainingTime += `${minutes} minutes `;
	remainingTime += `${seconds} seconds remaining`;

	return remainingTime.trim();
}

function calculateRemainingTimeForRepeated(daysOfWeek, repeatedTime) {
	if (!repeatedTime) return "No time set"; // This line checks if the time is actually provided

	const now = new Date();
	const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	const currentDay = dayNames[now.getDay()];
	const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

	const targetTimeParts = repeatedTime.split(":");
	if (targetTimeParts.length !== 2) return "Invalid time format"; // Handle invalid time format
	const targetHour = parseInt(targetTimeParts[0], 10);
	const targetMinute = parseInt(targetTimeParts[1], 10);
	const targetTime = targetHour * 3600 + targetMinute * 60;

	let closestTimeDiff = Infinity;
	let closestDate = null;

	daysOfWeek.forEach((day) => {
		const dayIndex = dayNames.indexOf(day);
		const dayDiff = (dayIndex - now.getDay() + 7) % 7;
		const targetDate = new Date(now);
		targetDate.setDate(now.getDate() + dayDiff);
		targetDate.setHours(targetHour, targetMinute, 0, 0);

		const diff = targetDate - now;

		if (diff < closestTimeDiff) {
			closestTimeDiff = diff;
			closestDate = targetDate;
		}
	});

	if (closestTimeDiff <= 0) {
		closestDate.setDate(closestDate.getDate() + 7);
		closestTimeDiff = closestDate - now;
	}

	return calculateRemainingTime(closestDate);
}

function updateRemainingTimes() {
	const reminderElements = document.querySelectorAll('[id^="reminder-"]');
	reminderElements.forEach((element) => {
		const reminderName = element.dataset.name;
		const reminderCategory = element.dataset.category;
		const daysOfWeek = element.dataset.days ? element.dataset.days.split(",") : [];
		const repeatedTime = element.dataset.repeatedTime;
		const reminderDate = element.dataset.date;

		let remainingTime = "";

		if (reminderCategory === "repeated") {
			remainingTime = calculateRemainingTimeForRepeated(daysOfWeek, repeatedTime);
		} else {
			remainingTime = calculateRemainingTime(reminderDate);
		}

		// Find the span element inside the reminder element to update the text
		const reminderText = element.querySelector("span");
		reminderText.textContent = `${reminderName} - ${remainingTime}`;
	});
}

function openTab(event, tabName) {
	const tabContents = document.querySelectorAll(".tab-content");
	tabContents.forEach((content) => {
		content.style.display = "none";
	});

	const tabButtons = document.querySelectorAll(".tab-button");
	tabButtons.forEach((button) => {
		button.className = button.className.replace(" active", "");
	});

	document.getElementById(tabName).style.display = "block";
	event.currentTarget.className += " active";
}

function showModal() {
	const modal = document.getElementById("reminderModal");
	modal.style.display = "block";
}

function closeModal() {
	const modal = document.getElementById("reminderModal");
	modal.style.display = "none";
}

function toggleDateTime() {
	const category = document.getElementById("reminderCategory").value;
	const dateTimeFields = document.querySelector(".datetime-container");
	const repeatedFields = document.querySelector(".repeated-container");

	if (category === "repeated") {
		dateTimeFields.style.display = "none";
		repeatedFields.style.display = "block";
	} else {
		dateTimeFields.style.display = "flex";
		repeatedFields.style.display = "none";
	}
}

window.onclick = function (event) {
	const modal = document.getElementById("reminderModal");
	if (event.target === modal) {
		closeModal();
	}
};

function deleteReminder(index) {
	let reminders = [];
	try {
		reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
	} catch (error) {
		console.error("Error reading reminders:", error);
	}

	reminders.splice(index, 1); // Remove the reminder from the array
	fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2)); // Save the updated reminders

	loadReminders(); // Reload the reminders to update the display
}
