class NotFoundError(Exception):
    """Resource not found."""

    def __init__(self, resource: str, identifier: str):
        self.resource = resource
        self.identifier = identifier
        super().__init__(f"{resource} not found: {identifier}")


class ValidationError(Exception):
    """Business validation error."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
