import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fallBackAvatar',
  standalone: true
})
export class FallbackAvatarPipe implements PipeTransform {
  private defaultAvatarUrl = 'https://www.mygiis.org/themes/general/images/noimage.jpeg';

  transform(imageUrl: string | null | undefined): string {
    return imageUrl ? imageUrl : this.defaultAvatarUrl;
  }
}
