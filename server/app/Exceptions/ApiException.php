<?php

namespace App\Exceptions;

use App\Http\Resources\ErrorResource;
use Exception;
use Illuminate\Http\Response;
use Illuminate\Http\Request;

class ApiException extends Exception
{
    protected string $errorCode;
    protected int $status;
    protected ?array $details = null;

    public function __construct(string $code, int $status, string $message = '', ?array $details = null)
    {
        parent::__construct($message, $status);
        $this->status = $status;
        $this->errorCode = $code;
        $this->details = $details;
    }

    /**
     * Automatic response rendering.
     */
    public function render(Request $request)
    {
        return ErrorResource::make(
            $this->getErrorCode(),
            $this->getStatus(),
            $this->getMessage(),
            $this->getDetails()
        )->toResponse($request);
    }

    public function getDetails(): ?array
    {
        return $this->details;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    /**
     * Bad Request - 400
     */
    public static function badRequest(?array $details = null): self
    {
        return new static(
            code: 'BAD_REQUEST',
            status: Response::HTTP_BAD_REQUEST,
            message: 'Bad Request',
            details: $details
        );
    }

    /**
     * Missing scope - 400
     */
    public static function missingScope(string $message = 'Missing scope', ?array $details = null): self
    {
        return new static(
            code: 'MISSING_SCOPE',
            status: Response::HTTP_UNAUTHORIZED,
            message: $message,
            details: $details
        );
    }

    /**
     * Forbidden - 403
     */
    public static function forbidden(?array $details = null): self
    {
        return new static(
            code: 'FORBIDDEN',
            status: Response::HTTP_FORBIDDEN,
            message: 'Forbidden',
            details: $details
        );
    }

    /**
     * Not Found - 404
     */
    public static function notFound(?array $details = null): self
    {
        return new static(
            code: 'NOT_FOUND',
            status: Response::HTTP_NOT_FOUND,
            message: 'Not Found',
            details: $details
        );
    }

    /**
     * Request source is not authorized to access this resource - 401
     */
    public static function unauthorizedRequestSource(?array $details = null): self
    {
        return new static(
            code: 'UNAUTHORIZED_REQUEST_SOURCE',
            status: Response::HTTP_UNAUTHORIZED,
            message: 'Request source is not authorized to access this resource.',
            details: $details
        );
    }

    /**
     * Access token invalid - 401
     */
    public static function accessTokenInvalid(?array $details = null): self
    {
        return new static(
            code: 'ACCESS_TOKEN_INVALID',
            status: Response::HTTP_UNAUTHORIZED,
            message: 'Access token invalid',
            details: $details
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Client
    |--------------------------------------------------------------------------
    */

    /**
     * The server requested data from the client but did not receive a response - 400
     */
    public static function clientResponseNotReceived(?array $details = null): self
    {
        return new static(
            code: 'CLIENT_RESPONSE_NOT_RECEIVED',
            status: Response::HTTP_BAD_REQUEST,
            message: 'The server requested data from the client but did not receive a response',
            details: $details
        );
    }

    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    /**
     * The user does not have the required permission to access this resource - 401
     */
    public static function permissionDenied(?array $details = null): self
    {
        return new static(
            code: 'PERMISSION_DENIED',
            status: Response::HTTP_FORBIDDEN,
            message: 'The user does not have the required permission to access this resource',
            details: $details
        );
    }

    /**
     * User deactivated - 403
     */
    public static function userDeactivated(?array $details = null): self
    {
        return new static(
            code: 'USER_DEACTIVATED',
            status: Response::HTTP_FORBIDDEN,
            message: 'User deactivated',
            details: $details
        );
    }

    /**
     * User not found - 404
     */
    public static function userNotFound(?array $details = null): self
    {
        return new static(
            code: 'USER_NOT_FOUND',
            status: Response::HTTP_NOT_FOUND,
            message: 'User not found',
            details: $details
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Timecode
    |--------------------------------------------------------------------------
    */

    /**
     * Timecodes already exist - 409
     */
    public static function timecodesAlreadyExist(?array $details = null): self
    {
        return new static(
            code: 'TIMECODES_ALREADY_EXIST',
            status: Response::HTTP_CONFLICT,
            message: 'Timecodes already exist',
            details: $details
        );
    }
}
