import { render, screen } from '@testing-library/react-native';
import App from '../../App';

describe('FoodStra App', () => {
  it('renders the branded landing screen', () => {
    render(<App />);
    // getByText throws if the node is absent, so these assert presence.
    expect(screen.getByText('FoodStra')).toBeTruthy();
    expect(screen.getByText('FS')).toBeTruthy();
  });
});
