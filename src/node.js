const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Connect to the database
mongoose.connect('mongodb://localhost/train-seat-booking', { useNewUrlParser: true });

// Define the schema for a seat
const seatSchema = new mongoose.Schema({
  row: Number,
  seatNumber: Number,
  isBooked: Boolean,
});

// Define the model for a seat
const Seat = mongoose.model('Seat', seatSchema);

// Seed the database with initial data
async function seed() {
  const seats = [];
  for (let row = 1; row <= 10; row++) {
    for (let seatNumber = 1; seatNumber <= 7; seatNumber++) {
      seats.push({ row, seatNumber, isBooked: false });
    }
  }
  await Seat.insertMany(seats);
}
//seed(); // uncomment this line to seed the database

// Set up middleware
app.use(bodyParser.json());

// Define routes

// Get all seats
app.get('/api/seats', async (req, res) => {
  const seats = await Seat.find({});
  res.json(seats);
});

// Book seats
app.post('/api/book', async (req, res) => {
  const { numSeats } = req.body;

  // Find available seats
  const availableSeats = await Seat.find({ isBooked: false });

  // Check if enough seats are available
  if (availableSeats.length < numSeats) {
    return res.json({ success: false, message: 'Not enough seats available.' });
  }

  // Find seats to book
  const seatsToBook = [];
  let consecutiveSeats = 0;
  for (const seat of availableSeats) {
    if (seatsToBook.length === numSeats) {
      break;
    }
    if (seat.seatNumber === 1) {
      consecutiveSeats = 1;
      seatsToBook.length = 0;
      seatsToBook.push(seat);
    } else if (consecutiveSeats > 0 && seat.seatNumber === seatsToBook[seatsToBook.length - 1].seatNumber + 1) {
      consecutiveSeats++;
      seatsToBook.push(seat);
      if (consecutiveSeats === numSeats) {
        break;
      }
    } else {
      consecutiveSeats = 0;
      seatsToBook.length = 0;
    }
  }

  // Book seats
  for (const seat of seatsToBook) {
    await Seat.findByIdAndUpdate(seat._id, { isBooked: true });
  }

  // Return booked seats
  res.json({ success: true, seats: seatsToBook });
});

// Start the server
const port = 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));
