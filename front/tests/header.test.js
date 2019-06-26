import Header from '../src/components/header';
// See: https://github.com/mzgoddard/preact-render-spy
import { shallow } from 'preact-render-spy';

const fakeUser = {
  profile_url: ''
};

describe('Initial Test of the Header', () => {
  test('Header renders Gladys Assistant title and 8 items in header', () => {
    const context = shallow(<Header user={fakeUser} currentUrl="/dashboard" />);
    expect(context.find('#header-title').text()).toBe('Gladys Assistant');
    expect(context.find('.nav-item').length).toBe(8);
  });
  test('Should return null, login page doesnt need a header', () => {
    const context = shallow(<Header user={fakeUser} currentUrl="/login" />);
    expect(context).toBe.null;
  });
  test('[Backslash URL] Header renders Gladys Assistant title and 8 items in header', () => {
    const context = shallow(<Header user={fakeUser} currentUrl="/dashboard/" />);
    expect(context.find('#header-title').text()).toBe('Gladys Assistant');
    expect(context.find('.nav-item').length).toBe(8);
  });
  test('[Backslash URL] Should return null, login page doesnt need a header', () => {
    const context = shallow(<Header user={fakeUser} currentUrl="/login/" />);
    expect(context).toBe.null;
  });
});
