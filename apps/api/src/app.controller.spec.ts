import { AppController } from './app.controller';

describe('AppController', () => {
  it('reports that the API is available', () => {
    expect(new AppController().health()).toEqual({
      name: 'API do Cartório',
      status: 'ok',
      documentation: '/api/docs',
    });
  });
});
