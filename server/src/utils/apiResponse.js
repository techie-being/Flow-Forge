class apiResponse{
    Constructor(data,statusCode,message="success"){
        this.data = data;
        this.statusCode = statusCode;
        this.message = message;
        this.success = success < 400;

    };
}
export default apiResponse;