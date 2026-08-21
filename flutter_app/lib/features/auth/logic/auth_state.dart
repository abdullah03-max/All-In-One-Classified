import 'package:equatable/equatable.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class Authenticated extends AuthState {
  final String userId;
  final String email;
  final String fullName;
  final String role;
  final bool isVerified;
  final String? avatarUrl;

  const Authenticated({
    required this.userId,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isVerified,
    this.avatarUrl,
  });

  @override
  List<Object?> get props => [userId, email, fullName, role, isVerified, avatarUrl];
}

class Unauthenticated extends AuthState {}

class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}

class OtpSent extends AuthState {
  final String email;
  final String type; // 'signup', 'login', 'recovery'

  const OtpSent({required this.email, required this.type});

  @override
  List<Object?> get props => [email, type];
}

class PasswordResetSent extends AuthState {
  final String email;

  const PasswordResetSent(this.email);

  @override
  List<Object?> get props => [email];
}

class PasswordRecoveryMode extends AuthState {
  final String email;

  const PasswordRecoveryMode({required this.email});

  @override
  List<Object?> get props => [email];
}

class PasswordUpdated extends AuthState {}
