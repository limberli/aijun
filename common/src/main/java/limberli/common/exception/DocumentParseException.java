package limberli.common.exception;

/** Thrown when an uploaded requirement document cannot be read or contains no usable text. */
public class DocumentParseException extends RuntimeException {
    public DocumentParseException(String message) {
        super(message);
    }

    public DocumentParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
