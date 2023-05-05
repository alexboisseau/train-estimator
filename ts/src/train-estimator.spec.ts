import { TrainTicketEstimator } from './train-estimator';
import {
  InvalidTripInputException,
  Passenger,
  TripDetails,
  TripRequest,
} from './model/trip.request';

class TrainTicketEstimatorOverload extends TrainTicketEstimator {
  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    return await Promise.resolve(50);
  }
}

describe('train estimator', function () {
  let alice: Passenger;
  let trainTicketEstimator: TrainTicketEstimatorOverload;
  const date: Date = new Date();

  beforeAll(() => {
    alice = new Passenger(20, []);
    trainTicketEstimator = new TrainTicketEstimatorOverload();
    date.setDate(date.getDay() + 20);
  });

  it('should return 0 for a less than 1 year old passenger', async () => {
    const passenger = new Passenger(0, []);
    const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', date);
    const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger]);

    expect(await trainTicketEstimator.estimate(tripRequest)).toBe(0);
  });

  it('should return an exception when start city is invalid', async function () {
    const tripDetails = new TripDetails('', 'Marseille', new Date());
    const tripRequest = new TripRequest(tripDetails, [alice]);
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Start city is invalid')
    );
  });
  it('should return an exception when destination city is invalid', async function () {
    const tripDetails = new TripDetails('Paris', '', new Date());
    const tripRequest = new TripRequest(tripDetails, [alice]);
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Destination city is invalid')
    );
  });
  it('should return an exception when date is invalid', async function () {
    const badDate = new Date();
    badDate.setDate(badDate.getDay() - 10);
    const tripDetails = new TripDetails('Paris', 'Marseille', badDate);
    const tripRequest = new TripRequest(tripDetails, [alice]);
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Date is invalid')
    );
  });
  it('should return an exception when a passenger age is invalid', async function () {
    const fakePassengerWithBadAge = new Passenger(-1, []);
    const tripDetails = new TripDetails('Paris', 'Marseille', new Date());
    const tripRequest = new TripRequest(tripDetails, [fakePassengerWithBadAge]);
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Age is invalid')
    );
  });

  it('should return 0 when no passenger', async function () {
    const tripDetails = new TripDetails('Paris', 'Milan', new Date());
    const tripRequest = new TripRequest(tripDetails, []);
    const result = await trainTicketEstimator.estimate(tripRequest);
    expect(result).toBe(0);
  });
});
