class AvatarService {
  constructor() {
    this.avatars = [
      'raindrop_blue_smile.svg',
      'raindrop_blue_wink.svg',
      'raindrop_blue_open.svg',
      'raindrop_blue_angry.svg',
      'raindrop_green_smile.svg',
      'raindrop_green_wink.svg',
      'raindrop_green_open.svg',
      'raindrop_green_angry.svg',
      'raindrop_red_smile.svg',
      'raindrop_red_wink.svg',
      'raindrop_red_open.svg',
      'raindrop_red_angry.svg',
      'raindrop_purple_smile.svg',
      'raindrop_purple_wink.svg',
      'raindrop_purple_open.svg',
      'raindrop_purple_angry.svg',
      'raindrop_yellow_smile.svg',
      'raindrop_yellow_wink.svg',
      'raindrop_yellow_open.svg',
      'raindrop_yellow_angry.svg'
    ]
  }

  getRandomAvatar() {
    const randomIndex = Math.floor(Math.random() * this.avatars.length)
    return this.avatars[randomIndex]
  }

  getAvatarPath(avatarFilename) {
    return `/raindrops/${avatarFilename}`
  }

  getFullAvatarPath(avatarFilename) {
    return this.getAvatarPath(avatarFilename)
  }

  getAllAvatars() {
    return [...this.avatars]
  }

  isValidAvatar(avatarFilename) {
    return this.avatars.includes(avatarFilename)
  }
}

export default new AvatarService()