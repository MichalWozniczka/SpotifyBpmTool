export class LibraryItem
{
    constructor(type, name, id, imageUrl)
    {
        this.type = type
        this.name = name;
        this.id = id;
        this.imageUrl = imageUrl;
    }

    get uri()
    {
        return "spotify:" + this.type.toLowerCase() + ":" + this.id;
    }
}

export class Album extends LibraryItem
{
    constructor(name, id, imageUrl, artists)
    {
        super("Album", name, id, imageUrl);
        this.artists = artists;
    }
}

export class Playlist extends LibraryItem
{
    constructor(name, id, imageUrl, owner)
    {
        super("Playlist", name, id, imageUrl);
        this.owner = owner;
    }
}

export class Track extends LibraryItem
{
    constructor(name, id, imageUrl, artists)
    {
        super("Track", name, id, imageUrl);
        this.artists = artists;
        this.tempo = 0;
    }
}