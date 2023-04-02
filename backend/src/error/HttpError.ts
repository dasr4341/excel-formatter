export default class HttpError extends Error {
    data: any;
    status: number;

    constructor(message: string, status: number, data: any) {
        super(message);
        this.message = message;
        this.status = status;
        this.data = data;
    }
}
