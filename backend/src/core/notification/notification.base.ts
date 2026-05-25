export abstract class NotificationBase {
    receipent:string;
    message:string;
    
    constructor(receipent:string,message:string){
        this.receipent=receipent;
        this.message=message;

    }
    abstract send():Promise<void>;
}