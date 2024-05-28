let $window = typeof window !== 'undefined' ? window : null

export function mockWindow(self) {
  $window = self || window // mock window for unit testing
}

/**
 * We use shorter names to reduce the final bundle size
 *
 * Properties:
 * @u = url
 * @t = title
 * @d = description
 * @q = quote
 * @h = hashtags
 * @m = media
 * @tu = twitterUser
 */

const networks = {
  baidu: 'http://cang.baidu.com/do/add?iu=@u&it=@t',
  buffer: 'https://bufferapp.com/add?text=@t&url=@u',
  email: 'mailto:?subject=@t&body=@u%0D%0A@d',
  evernote: 'https://www.evernote.com/clip.action?url=@u&title=@t',
  facebook: 'https://www.facebook.com/sharer/sharer.php?u=@u&title=@t&description=@d&quote=@q&hashtag=@h',
  flipboard: 'https://share.flipboard.com/bookmarklet/popout?v=2&url=@u&title=@t',
  hackernews: 'https://news.ycombinator.com/submitlink?u=@u&t=@t',
  instapaper: 'http://www.instapaper.com/edit?url=@u&title=@t&description=@d',
  line: 'http://line.me/R/msg/text/?@t%0D%0A@u%0D%0A@d',
  linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=@u',
  messenger: 'fb-messenger://share/?link=@u',
  odnoklassniki: 'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&st.shareUrl=@u&st.comments=@t',
  pinterest: 'https://pinterest.com/pin/create/button/?url=@u&media=@m&description=@t',
  pocket: 'https://getpocket.com/save?url=@u&title=@t',
  quora: 'https://www.quora.com/share?url=@u&title=@t',
  reddit: 'https://www.reddit.com/submit?url=@u&title=@t',
  skype: 'https://web.skype.com/share?url=@t%0D%0A@u%0D%0A@d',
  sms: 'sms:?body=@t%0D%0A@u%0D%0A@d',
  stumbleupon: 'https://www.stumbleupon.com/submit?url=@u&title=@t',
  telegram: 'https://t.me/share/url?url=@u&text=@t%0D%0A@d',
  threads: 'https://www.threads.net/intent/post?text=@t%20%7C%20@u',
  tumblr: 'https://www.tumblr.com/share/link?url=@u&name=@t&description=@d',
  twitter: 'https://twitter.com/intent/tweet?text=@t&url=@u&hashtags=@h@tu',
  viber: 'viber://forward?text=@t%0D%0A@u%0D%0A@d',
  vk: 'https://vk.com/share.php?url=@u&title=@t&description=@d&image=@m&noparse=true',
  weibo: 'http://service.weibo.com/share/share.php?url=@u&title=@t&pic=@m',
  whatsapp: 'https://api.whatsapp.com/send?text=@t%0D%0A@u%0D%0A@d',
  wordpress: 'https://wordpress.com/press-this.php?u=@u&t=@t&s=@d&i=@m',
  xing: 'https://www.xing.com/social/share/spi?op=share&url=@u&title=@t',
  yammer: 'https://www.yammer.com/messages/new?login=true&status=@t%0D%0A@u%0D%0A@d'
}

export class SharingLink {
  constructor(network, params) {
    this.network = network;

    // url: URL of the content to share.
    if (!params.url) {
      throw new Error('URL is required');
    } else {
      this.url = params.url;
    }

    // title: Title of the content to share.
    if (!params.title) {
      throw new Error('Title is required');
    } else {
      this.title = params.title;
    }

    // description: Description of the content to share.
    if (!params.description) {
      throw new Error('Description is required');
    } else {
      this.description = params.description;
    }

    // quote: Quote content, used for Facebook.
    this.quote = params.quote || '';

    // hashtags: Hashtags, used for Twitter and Facebook.
    this.hashtags = params.hashtags || '';

    // twitterUser: Twitter user, used for Twitter
    this.twitterUser = params.twitterUser || '';

    // media: Media to share, used for Pinterest
    this.media = params.media || '';

    // popupSize: Properties to configure the popup window.
    this.popupSize = params.popupSize || {
      width: 626,
      height: 436
    };

    this.popupWindow = undefined;
  }


  get key() {
    return this.network.toLowerCase()
  }

  /**
   * Network sharing raw sharing link.
   */
  get rawLink() {
    const ua = navigator.userAgent.toLowerCase()

    /**
     * On IOS, SMS sharing link need a special formatting
     * Source: https://weblog.west-wind.com/posts/2013/Oct/09/Prefilling-an-SMS-on-Mobile-Devices-with-the-sms-Uri-Scheme#Body-only
     */
    if (this.key === 'sms' && (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1)) {
      return networks[this.key].replace(':?', ':&')
    }

    return networks[this.key]
  }

  /**
   * Create the url for sharing.
   */
  get shareLink() {
    let link = this.rawLink

    /**
     * Twitter sharing shouldn't include empty parameter
     * Source: https://github.com/nicolasbeauvais/vue-social-sharing/issues/143
     */
    if (this.key === 'twitter') {
      if (!this.hashtags.length) link = link.replace('&hashtags=@h', '')
      if (!this.twitterUser.length) link = link.replace('@tu', '')
    }

    return link
      .replace(/@tu/g, '&via=' + encodeURIComponent(this.twitterUser))
      .replace(/@u/g, encodeURIComponent(this.url))
      .replace(/@t/g, encodeURIComponent(this.title))
      .replace(/@d/g, encodeURIComponent(this.description))
      .replace(/@q/g, encodeURIComponent(this.quote))
      .replace(/@h/g, this.encodedHashtags)
      .replace(/@m/g, encodeURIComponent(this.media))
  }

  /**
   * Encoded hashtags for the current social network.
   */
  get encodedHashtags() {
    if (this.key === 'facebook' && this.hashtags.length) {
      return '%23' + this.hashtags.split(',')[0]
    }

    return this.hashtags
  }

  /**
   * Shares URL in specified network.
   * 
   * Center the popup on multi-screens
   * http://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen/32261263
  */
  share() {

    const width = $window.innerWidth || (document.documentElement.clientWidth || $window.screenX)
    const height = $window.innerHeight || (document.documentElement.clientHeight || $window.screenY)

    const popupLeft = (width - this.popupSize.width) / 2 + ($window.screenLeft !== undefined ? $window.screenLeft : $window.screenX)
    const popupTop = (height - this.popupSize.height) / 2 + ($window.screenTop !== undefined ? $window.screenTop : $window.screenY)

    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
    }

    if (this.popupWindow) {
      // Force close (for Facebook)
      this.popupWindow.close()
    }

    this.popupWindow = $window.open(
      this.shareLink,
      'sharer-' + this.key,
      ',height=' + this.popupSize.height +
      ',width=' + this.popupSize.width +
      ',left=' + popupLeft +
      ',top=' + popupTop +
      ',screenX=' + popupLeft +
      ',screenY=' + popupTop
    )

    // If popup are prevented (AdBlocker, Mobile App context..), popup.window stays undefined and we can't display it
    if (!this.popupWindow) return

    this.popupWindow.focus();
  }

  /**
   * Touches network and emits click event.
   */
  touch() {
    window.open(this.shareLink, '_blank')
  }
}