require("dotenv").config()
const express = require("express")
const morgan = require("morgan")
const Person = require("./models/Person")
const cors = require("cors")

const app = express()

morgan.token("body", (request, response) => {
	if (request.method == "POST") {
		// console.log("POST method detected!")
		return JSON.stringify(request.body)
	}
	return " "
})

app.use(cors())
app.use(express.json())
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :body"))


// _______________________________________


app.post("/api/parser", (request, response, next) => {
    const content = request.data.content

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
