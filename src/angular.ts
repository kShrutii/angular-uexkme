import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Seat {
  _id: string;
  row: number;
  seatNumber: number;
  isBooked: boolean;
}

@Component({
  selector: 'app-root',
  template: `
    <h1>Train Seat Booking System</h1>
    <p>{{ message }}</p>
    <div *ngFor="let row of rows">
      <div *ngFor="let seat of row">
        <div class="seat" [ngClass]="{'booked': seat.isBooked}" (click)="book(seat)">
          {{ seat.seatNumber }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .seat {
        display: inline-block;
        width: 50px;
        height: 50px;
        border: 1px solid black;
        margin: 5px;
        text-align: center;
        line-height: 50px;
        font-weight: bold;
        cursor: pointer;
      }
      .booked {
        background-color: gray;
        color: white;
        cursor: not-allowed;
      }
    `,
  ],
})
export class AppComponent {
  rows: Seat[][] = [];
  message = '';

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    const seats = await this.http.get<Seat[]>('/api/seats').toPromise();
    for (let row = 1; row <= 10; row++) {
      const rowSeats = [];
      for (let seatNumber = 1; seatNumber <= 7; seatNumber++) {
        const seat = seats.find(s => s.row === row && s.seatNumber === seatNumber);
        rowSeats.push(seat || { _id: '', row, seatNumber, isBooked: true });
      }
      this.rows.push(rowSeats);
    }
  }

  async book(seat: Seat) {
    if (seat.isBooked) {
      this.message = 'Seat is already booked.';
    } else {
      const numSeats = 1;
      const response = await this.http.post<{ success: boolean; message?: string; seats?: Seat[] }>(
        '/api/book',
        { numSeats }
      ).toPromise();
      if (response.success) {
        for (const bookedSeat of response.seats!) {
          const rowSeats = this.rows[bookedSeat.row - 1];
          const index = rowSeats.findIndex(s => s.seatNumber === bookedSeat.seatNumber);
          rowSeats.splice(index, 1, bookedSeat);
        }
        this.message = `Seat(s) booked: ${response.seats!.map(s => `${s.row}${s.seatNumber}`).join(', ')}`;
      } else {
        this.message = response.message!;
      }
    }
  }
}
