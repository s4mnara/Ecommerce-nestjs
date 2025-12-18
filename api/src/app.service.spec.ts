import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('should return a string', () => {
    const result = service.getHello();
    expect(typeof result).toBe('string');
  });
});
