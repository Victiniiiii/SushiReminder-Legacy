const fs = require("fs");
const path = require("path");
const remindersPath = path.join(__dirname, "reminders.json");

function requestNotificationPermission() {
	if (Notification.permission === "default") {
		Notification.requestPermission().then(permission => {
			if (permission !== "granted") {
				console.error("Notification permission not granted.");
			}
		});
	}
}

function sendNotification(title, body) {
	if (Notification.permission === "granted") {
		new Notification(title, { body });
	} else {
		console.error("Notification permission not granted.");
	}
}

document.addEventListener("DOMContentLoaded", () => {
	requestNotificationPermission();
	loadReminders();
	document.querySelector(".tab-button").click();
	document.getElementById("createReminderBtn").addEventListener("click", showModal);
	document.querySelector(".close").addEventListener("click", closeModal);
	document.getElementById("settingsBtn").addEventListener("click", () => openTab(event, "settings"));
	document.getElementById("saveReminderBtn").addEventListener("click", saveReminder);
	document.getElementById("reminderCategory").addEventListener("change", toggleDateTime);
});

function validateReminder(name, category, date, time, time2, daysOfWeek) {
	if (!name) {
		alert("Reminder name is required.");
		return false;
	}

    if (name.length > 50) {
		alert("Please enter a shorter reminder name.");
		return false;
	}

    if ((category === "one-time" && !time) || (category === "repeated" && !time2)) {
        alert("Time is required.");
        return false;
    }

	if (category === "one-time" && !date) {
        alert("The date is required for one-time reminders.");
        return false;		
	} 
    
    if (category === "repeated" && daysOfWeek.length === 0) {
        alert("At least one day must be selected for repeated reminders.");
        return false;
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
		reminderElement.dataset.repeatedTime = reminder.repeatedTime || "";

		const deleteButton = document.createElement("button");
		deleteButton.textContent = "Delete";
		deleteButton.className = "delete-button";
		deleteButton.onclick = () => deleteReminder(index);
        reminderElement.appendChild(deleteButton);

		const reminderText = document.createElement("span");
		if (reminder.category === "repeated") {
			reminderText.textContent = `${reminder.name} - ${calculateRemainingTimeForRepeated(reminder.daysOfWeek, reminder.repeatedTime)}`;

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = reminder.completed || false;
			checkbox.className = "completed-checkbox";
			checkbox.addEventListener("change", () => {
				reminder.completed = checkbox.checked;
				updateReminder(index, reminder);
			});

			reminderElement.appendChild(checkbox);
		} else {
			reminderText.textContent = `${reminder.name} - ${calculateRemainingTime(reminder.date)}`;
		}

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
    const repeatedReminderDateTime = document.getElementById("reminderRepeatedTime").value;
    const reminderRepeatedTime = document.getElementById("reminderRepeatedTime").value;

    let daysOfWeek = [];
    if (reminderCategory === "repeated") {
        const checkboxes = document.querySelectorAll('input[name="days"]:checked');
        checkboxes.forEach((checkbox) => {
            daysOfWeek.push(checkbox.value);
        });
    }

    if (!validateReminder(reminderName, reminderCategory, reminderDate, reminderDateTime, repeatedReminderDateTime, daysOfWeek)) {
        return;
    }

    const newReminder = {
        name: reminderName,
        category: reminderCategory,
        date: reminderCategory === "one-time" ? `${reminderDate}T${reminderDateTime}` : null,
        daysOfWeek: reminderCategory === "repeated" ? daysOfWeek : null,
        repeatedTime: reminderCategory === "repeated" ? reminderRepeatedTime : null,
        completed: false,
        notificationSent: false
    };

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

function updateReminder(index, updatedReminder) {
	let reminders = [];
	try {
		reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
	} catch (error) {
		console.error("Error reading reminders:", error);
	}

	reminders[index] = updatedReminder;
	fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
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
    const now = new Date();
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const currentDayIndex = (now.getDay() + 6) % 7;
    const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const targetTimeParts = repeatedTime.split(":");
    if (targetTimeParts.length !== 2) return "Invalid time format";
    const targetHour = parseInt(targetTimeParts[0], 10);
    const targetMinute = parseInt(targetTimeParts[1], 10);
    const targetTimeInSeconds = targetHour * 3600 + targetMinute * 60;

    let closestTimeDiff = Infinity;
    let closestDayDiff = Infinity;

    daysOfWeek.forEach(day => {
        const dayIndex = dayNames.indexOf(day);
        let dayDiff = (dayIndex - currentDayIndex + 7) % 7;

        if (dayDiff === 0 && currentTimeInSeconds > targetTimeInSeconds) {
            dayDiff += 7;
        }

        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + dayDiff);
        targetDate.setHours(targetHour, targetMinute, 0, 0);

        const timeDiff = targetDate - now;

        if (dayDiff < closestDayDiff || (dayDiff === closestDayDiff && timeDiff < closestTimeDiff)) {
            closestDayDiff = dayDiff;
            closestTimeDiff = timeDiff;
        }
    });

    const closestDate = new Date(now);
    closestDate.setDate(now.getDate() + closestDayDiff);
    closestDate.setHours(targetHour, targetMinute, 0, 0);

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

        const reminderText = element.querySelector("span");
        reminderText.textContent = `${reminderName} - ${remainingTime}`;

        let reminders = [];
        try {
            reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
        } catch (error) {
            console.error("Error reading reminders:", error);
        }

        const reminderIndex = reminders.findIndex(r => r.name === reminderName);

        if (reminderCategory === "repeated") {
            const checkbox = element.querySelector('input[type="checkbox"]');
            if (remainingTime === "Time's up!" && checkbox && !checkbox.checked) {
                checkbox.checked = false;
                reminders[reminderIndex].completed = false;
                fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
            }
        } else if (reminderCategory === "one-time" && remainingTime === "Time's up!") {
            if (!reminders[reminderIndex].notificationSent) {
                sendNotification(`${reminderName} is due!`, `Reminder: ${remainingTime}`);
                reminders[reminderIndex].notificationSent = true;
                fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
            }
        }
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

	reminders.splice(index, 1);
	fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));

	loadReminders();
}
