import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  TripRequest,
} from './model/trip.request';

export class TrainTicketEstimator {
  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    throw new Error('Should not be call from a test');
  }

  validTripRequestInput(tripRequest: TripRequest) {
    if (tripRequest.passengers.length === 0) {
      return 0;
    }

    if (tripRequest.details.from.trim().length === 0) {
      throw new InvalidTripInputException('Start city is invalid');
    }

    if (tripRequest.details.to.trim().length === 0) {
      throw new InvalidTripInputException('Destination city is invalid');
    }

    if (
      tripRequest.details.when <
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDay(), 0, 0, 0)
    ) {
      throw new InvalidTripInputException('Date is invalid');
    }

    tripRequest.passengers.forEach((passenger) => {
      if (passenger.age < 0) {
        throw new InvalidTripInputException('Age is invalid');
      }
    });
  }

  async estimate(tripRequest: TripRequest): Promise<number> {
    this.validTripRequestInput(tripRequest);

    // TODO USE THIS LINE AT THE END
    let b;
    try {
      b = await this.getPriceFromApi(
        tripRequest.details.from,
        tripRequest.details.to,
        tripRequest.details.when
      );
    } catch (error) {
      throw new ApiException();
    }

    const passengers = tripRequest.passengers;
    let tot = 0;
    let tmp = b;
    for (let i = 0; i < passengers.length; i++) {
      if (passengers[i].age < 1) {
        continue;
      }
      // Seniors
      else if (passengers[i].age <= 17) {
        tmp = b * 0.6;
      } else if (passengers[i].age >= 70) {
        tmp = b * 0.8;
        if (passengers[i].discounts.includes(DiscountCard.Senior)) {
          tmp -= b * 0.2;
        }
      } else {
        tmp = b * 1.2;
      }

      const d = new Date();
      if (tripRequest.details.when.getTime() >= d.setDate(d.getDate() + 30)) {
        tmp -= b * 0.2;
      } else if (tripRequest.details.when.getTime() > d.setDate(d.getDate() - 30 + 5)) {
        const date1 = tripRequest.details.when;
        const date2 = new Date();
        //https://stackoverflow.com/questions/43735678/typescript-get-difference-between-two-dates-in-days
        const diff = Math.abs(date1.getTime() - date2.getTime());
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

        tmp += (20 - diffDays) * 0.02 * b; // I tried. it works. I don't know why.
      } else {
        tmp += b;
      }

      if (passengers[i].age > 0 && passengers[i].age < 4) {
        tmp = 9;
      }

      if (passengers[i].discounts.includes(DiscountCard.TrainStroke)) {
        tmp = 1;
      }

      tot += tmp;
      tmp = b;
    }

    if (passengers.length == 2) {
      let cp = false;
      let mn = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.Couple)) {
          cp = true;
        }
        if (passengers[i].age < 18) {
          mn = true;
        }
      }
      if (cp && !mn) {
        tot -= b * 0.2 * 2;
      }
    }

    if (passengers.length == 1) {
      let cp = false;
      let mn = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.HalfCouple)) {
          cp = true;
        }
        if (passengers[i].age < 18) {
          mn = true;
        }
      }
      if (cp && !mn) {
        tot -= b * 0.1;
      }
    }

    return tot;
  }
}
