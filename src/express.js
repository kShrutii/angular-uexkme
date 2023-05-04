const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Seat = require('./models/seat');

mongoose.connect('mongodb://localhost/train-booking');

const app = express();
app.use(bodyParser.json());

app.get('/seats', async (req, res) => {
  const seats = await Seat.find();
  res.json(seats);
});

app.post('/book', async (req, res) => {
  const numSeats = req.body.numSeats;
  const seats = await Seat.find({ isBooked: false });
  const availableSeats = findAvailableSeats(seats, numSeats);
  if (availableSeats.length === numSeats) {
    for (const seat of availableSeats) {
      await Seat.findByIdAndUpdate(seat._id, { isBooked: true });
    }
    res.json({ success: true, seats: availableSeats });
  } else {
    res.json({ success: false, message: `No ${numSeats} seats available.` });
  }
});

function findAvailableSeats(seats, numSeats) {
  let availableSeats = [];
  let consecutiveEmptySeats = 0;
  let row = 1;
  for (const seat of seats) {
    if (seat.row !== row) {
      consecutiveEmptySeats = 0;
      row = seat.row;
    }
    if (!seat.isBooked) {
      consecutiveEmptySeats++;
      if (consecutiveEmptySeats === numSeats) {
        availableSeats = seats.filter(s => s.row === row && s.seatNumber >= seat.seatNumber - numSeats + 1 && s.seatNumber <= seat.seatNumber);
        break;
      }
    } else {
      consecutiveEmptySeats = 0;
    }
  }
  return availableSeats;
}

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
