require("dotenv").config()
const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const { GoogleGenAI } = require('@google/genai')
// ________ GOOGLE CAL ___________
const path = require("node:path")
const process =require("node:process")   
const {authenticate} = require("@google-cloud/local-auth")
const {google} = require("googleapis")

const app = express()

morgan.token("body", (request, response) => {
	if (request.method == "POST") {
		return JSON.stringify(request.body)
	}
	return " "
})

app.use(cors())
app.use(express.json())
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :body"))


// _______________________________________

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials/keys.json')


// Create a new Calendar API client.


const event = {
  'summary': 'Google I/O 2015',
  'description': 'A chance to hear more about Google\'s developer products.',
  'start': {
    'dateTime': '2025-10-04T09:00:00',
    'timeZone': 'America/New_York',
  },
  'end': {
    'dateTime': '2025-10-04T10:00:00',
    'timeZone': 'America/New_York',
  },
  'recurrence': [
    'RRULE:FREQ=WEEKLY;BYDAY=MO'
  ],
  'reminders': {
    'useDefault': false,
    'overrides': [
      {'method': 'email', 'minutes': 24 * 60},
      {'method': 'popup', 'minutes': 10},
    ],
  },
};

app.post("/api/create", async (request, response, next) => {
    const eventsJSON = JSON.parse(request.body.events.replace("\`\`\`", "").replace("\`\`\`", "").replace("json", ""))
    const events = eventsJSON.tasks

    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: SCOPES,
    });

    const calendar = google.calendar({version: 'v3', auth});

    for (let event of events) {
        try {
            // 1. Use 'await' - it's much cleaner
            const result = await calendar.events.insert({
                calendarId: 'biuchutnu@gmail.com',
                resource: event,
            });

            // 2. The result object is the same, you still access 'data'
            console.log('Event created: %s', result.data.htmlLink);


        } catch (error) {
            console.log('Error contacting the Calendar service:', error);
            next(error); // Pass error to your handler
        }
    }

    response.status(201).json({"status": "success"})
    
})

// - "task_type": (String) Must be one of: "MEDICATION", "APPOINTMENT", "SYMPTOM_TRACKING", "TESTING", "LIFESTYLE".
// - "summary": (String) A brief, clear summary of the task for a calendar event title.
// - "details": (String) A more detailed description of the task.
// - "frequency": (String) How often the task should occur. e.g., "Once daily", "In 2 weeks".
// - "duration_days": (Integer) For how many days the task should continue. Use 1 for one-time events, -1 for indefinite. 

app.post("/api/parser", async (request, response, next) => {
    const content = `
      You are an intelligent medical assistant responsible for extracting actionable tasks from patient notes. Your task is to analyze the provided text and identify all medical tasks such as medication schedules, appointments, and symptom monitoring.

      Your response MUST be a single, plain-text valid JSON object. Do not include any text or explanations before or after the JSON object.

      The JSON object should have a single key, "tasks", which contains a list of task objects. Each task object in the list must look like the following JSON object:

      Today is 10/04/2025, so create the dates accordingly.
            

    "{
        tasks: [
            {
                "summary": (String) "Google I/O 2015",
                "description": (String) "A chance to hear more about Google's developer products.",
                "start": {
                    "dateTime": (String - ISO 8601 standard) "2025-10-04T09:00:00",
                    "timeZone": (String - IANA Time Zone Database) "America/New_York"
                },
                "end": {
                    "dateTime": (String - ISO 8601 standard) "2025-10-04T10:00:00",
                    "timeZone": (String - IANA Time Zone Database) "America/New_York"
                },
                "reminders": {
                    "useDefault": (boolean) false,
                    "overrides": [
                        {
                            "method": "email",
                            "minutes": 1440
                        },
                        {
                            "method": "popup",
                            "minutes": 10
                        }
                    ]
                }
            },
            // Some other events here if needed
        ]
    }"

      Here is the medical text to analyze:
      ---
      ${request.body.content}
      ---
    `
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY })
    const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: content,
    });
    console.log(res.text)

    response.status(200).json(res.text)
})


// app.delete("/api/persons/:id", (request, response, next) => {
// 	const id = request.params.id
// 	Person.findByIdAndDelete(id)
// 		.then(res => {
// 			response.status(204).end()
// 		})
// 		.catch(error => next(error))
// })


// _______________________________________


// handle unknown endpoint
const unknownEndpointHandler = (request, response) => {
	response.status(404).json({error: "Unknown Endpoint"})
}
app.use(unknownEndpointHandler)


// handle errors
const errorHandler = (error, request, response, next) => {
	// console.log(error.message)
	if (error.name == "CastError") {
		return response.status(400).json({error: "Invalid ID"})
	}
	if (error.name == "ValidationError") {
		return response.status(400).json({error: error.message})
	}
	next(error)
}
app.use(errorHandler)


// _______________________________________


const PORT = process.env.PORT
app.listen(PORT, () => {
	console.log(`Phonebook backend running on port ${PORT}`)
})
