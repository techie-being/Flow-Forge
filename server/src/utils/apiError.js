class apiError extends Error {
    constructor(statusCode,message,success="false",errors=[],stack=""){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = success;
        this.data = null;
        this.errors = errors;

        if(stack){
            this.stack=stack;
        }
        else{
            Error.captureStackTrace(this,this.constructor);
        }


    }
}
export default apiError;