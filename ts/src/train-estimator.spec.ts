import { TrainTicketEstimator } from './train-estimator';

class TrainTicketEstimatorOverload extends TrainTicketEstimator {
  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    return await Promise.resolve(50);
  }
}

describe('train estimator', function () {
  it('should work', () => {
    expect(1 + 2).toBe(3);
  });
});
