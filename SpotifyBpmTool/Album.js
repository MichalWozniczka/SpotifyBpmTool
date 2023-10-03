import { LibraryItem } from "./LibraryItem"

export class Album extends LibraryItem
{
    constructor(name, id, imageUrl, artists)
    {
        super("Album", name, id, imageUrl);
        this.artists = artists;
    }
}