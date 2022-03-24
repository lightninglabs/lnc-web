import { ProtobufMessage } from '@improbable-eng/grpc-web/dist/typings/message';
import { Metadata } from '@improbable-eng/grpc-web/dist/typings/metadata';
import { MethodDefinition, UnaryMethodDefinition } from '@improbable-eng/grpc-web/dist/typings/service';
declare class GrpcClient {
    /**
     * Indicates if the API should return sample data instead of making real GRPC requests
     */
    useSampleData: boolean;
    /**
     * Executes a single GRPC request and returns a promise which will resolve with the response
     * @param methodDescriptor the GRPC method to call on the service
     * @param request The GRPC request message to send
     * @param metadata headers to include with the request
     */
    request<TReq extends ProtobufMessage, TRes extends ProtobufMessage>(methodDescriptor: UnaryMethodDefinition<TReq, TRes>, request: TReq, metadata?: Metadata.ConstructorArg): Promise<TRes>;
    /**
     * Subscribes to a GRPC server-streaming endpoint and executes the `onMessage` handler
     * when a new message is received from the server
     * @param methodDescriptor the GRPC method to call on the service
     * @param request the GRPC request message to send
     * @param onMessage the callback function to execute when a new message is received
     * @param metadata headers to include with the request
     */
    subscribe<TReq extends ProtobufMessage, TRes extends ProtobufMessage>(methodDescriptor: MethodDefinition<TReq, TRes>, request: TReq, onMessage: (res: TRes) => void, metadata?: Metadata.ConstructorArg): void;
}
export default GrpcClient;
