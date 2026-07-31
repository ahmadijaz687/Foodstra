import { fireEvent, render, screen } from '@testing-library/react-native';
import { Money, PrimaryButton } from './ui';

describe('ui components', () => {
  it('fires onPress when a button is enabled', () => {
    const onPress = jest.fn();
    render(<PrimaryButton testID="btn" label="Go" onPress={onPress} />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    render(<PrimaryButton testID="btn" label="Go" onPress={onPress} disabled />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('formats minor units as dollars', () => {
    render(<Money minor={1299} />);
    expect(screen.getByText('$12.99')).toBeTruthy();
  });
});
