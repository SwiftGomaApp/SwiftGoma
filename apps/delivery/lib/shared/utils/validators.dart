final _emailRegExp = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
final _phoneRegExp = RegExp(r'^\+?[0-9\s-]{7,15}$');

bool isValidEmail(String value) => _emailRegExp.hasMatch(value.trim());

bool isValidPhone(String value) => _phoneRegExp.hasMatch(value.trim());
