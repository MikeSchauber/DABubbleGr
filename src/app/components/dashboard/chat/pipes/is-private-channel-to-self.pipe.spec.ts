import { IsPrivateChannelToSelfPipe } from './is-private-channel-to-self.pipe';

describe('IsPrivateChannelToSelfPipe', () => {
  it('create an instance', () => {
    const pipe = new IsPrivateChannelToSelfPipe();
    expect(pipe).toBeTruthy();
  });
});
