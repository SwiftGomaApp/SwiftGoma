import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:swiftgoma_client/features/cart/model/cart_item.dart';

class CartCubit extends Cubit<List<CartItem>> {
  CartCubit() : super(const []);

  int get itemCount => state.fold(0, (sum, item) => sum + item.quantity);

  double get total => state.fold(0, (sum, item) => sum + item.total);

  void add(CartItem item) {
    final int index = state.indexOf(item);
    if (index == -1) {
      emit([...state, item]);
      return;
    }
    final List<CartItem> updated = [...state];
    updated[index] =
        updated[index].copyWith(quantity: updated[index].quantity + item.quantity);
    emit(updated);
  }

  void increment(CartItem item) {
    final List<CartItem> updated = [...state];
    final int index = updated.indexOf(item);
    if (index == -1) return;
    updated[index] = updated[index].copyWith(quantity: updated[index].quantity + 1);
    emit(updated);
  }

  void decrement(CartItem item) {
    final List<CartItem> updated = [...state];
    final int index = updated.indexOf(item);
    if (index == -1) return;
    if (updated[index].quantity <= 1) {
      updated.removeAt(index);
    } else {
      updated[index] =
          updated[index].copyWith(quantity: updated[index].quantity - 1);
    }
    emit(updated);
  }

  void clear() => emit(const []);
}
