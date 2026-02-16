import { CouponsService } from './coupons.service';
import { Coupon, CouponDiscountType } from '../entities/coupon.entity';

type MockRepository = {
  findOne: jest.Mock;
  count: jest.Mock;
};

/**
 * Cria instancia de cupom com defaults seguros para testes.
 *
 * Motivo:
 * centralizar factory reduz ruido nos cenarios e garante que os campos
 * usados pela validacao publica estejam sempre preenchidos.
 */
function buildCoupon(overrides?: Partial<Coupon>) {
  return {
    id: 1,
    code: 'PROMO10',
    name: 'Promocao',
    description: null,
    discountType: CouponDiscountType.FIXED,
    discountValue: '10.00',
    minimumOrderAmount: '0.00',
    usageLimit: null,
    usageCount: 0,
    startsAt: null,
    endsAt: null,
    isActive: true,
    firstOrderOnly: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Coupon;
}

/**
 * Monta o servico de cupons com repositories mockados.
 *
 * Motivo:
 * isolar regras de negocio evita dependencia de banco/TypeORM nos testes
 * unitarios e deixa as assercoes focadas no contrato de validacao.
 */
function setup() {
  const couponsRepository: MockRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };
  const clientsRepository: MockRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };
  const ordersRepository: MockRepository = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const service = new CouponsService(
    couponsRepository as never,
    clientsRepository as never,
    ordersRepository as never,
  );

  return {
    service,
    couponsRepository,
    clientsRepository,
    ordersRepository,
  };
}

describe('CouponsService.validateForPublicCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns invalid when coupon requires phone and phone is missing', async () => {
    const { service, couponsRepository, clientsRepository, ordersRepository } = setup();
    couponsRepository.findOne.mockResolvedValue(
      buildCoupon({ usageLimit: 1, firstOrderOnly: false }),
    );

    const response = await service.validateForPublicCheckout({
      code: 'promo10',
      subtotal: 120,
    });

    expect(response.valid).toBe(false);
    expect(response.message).toBe(
      'Informe um telefone valido para validar este cupom no checkout',
    );
    expect(clientsRepository.findOne).not.toHaveBeenCalled();
    expect(ordersRepository.count).not.toHaveBeenCalled();
  });

  it('returns invalid when usage limit by client phone is reached', async () => {
    const { service, couponsRepository, clientsRepository, ordersRepository } = setup();
    couponsRepository.findOne.mockResolvedValue(
      buildCoupon({ id: 55, usageLimit: 2, firstOrderOnly: false }),
    );
    clientsRepository.findOne.mockResolvedValue({ id: 99 });
    ordersRepository.count.mockResolvedValue(2);

    const response = await service.validateForPublicCheckout({
      code: 'PROMO10',
      subtotal: 150,
      clientPhone: '(11) 99999-9999',
    });

    expect(response.valid).toBe(false);
    expect(response.message).toBe('Cupom atingiu limite de uso para este cliente');
  });

  it('returns invalid when coupon is first order only and client already purchased', async () => {
    const { service, couponsRepository, clientsRepository, ordersRepository } = setup();
    couponsRepository.findOne.mockResolvedValue(
      buildCoupon({ usageLimit: null, firstOrderOnly: true }),
    );
    clientsRepository.findOne.mockResolvedValue({ id: 7 });
    ordersRepository.count.mockResolvedValue(1);

    const response = await service.validateForPublicCheckout({
      code: 'PROMO10',
      subtotal: 100,
      clientPhone: '11988887777',
    });

    expect(response.valid).toBe(false);
    expect(response.message).toBe('Cupom valido apenas para primeiro pedido do cliente');
  });

  it('returns valid and calculates percentage discount correctly', async () => {
    const { service, couponsRepository } = setup();
    couponsRepository.findOne.mockResolvedValue(
      buildCoupon({
        code: 'PERC10',
        discountType: CouponDiscountType.PERCENTAGE,
        discountValue: '10.00',
      }),
    );

    const response = await service.validateForPublicCheckout({
      code: 'perc10',
      subtotal: 100,
    });

    expect(response.valid).toBe(true);
    expect(response.code).toBe('PERC10');
    expect(response.discountAmount).toBe('10.00');
    expect(response.finalSubtotal).toBe('90.00');
  });

  it('caps fixed discount at subtotal value', async () => {
    const { service, couponsRepository } = setup();
    couponsRepository.findOne.mockResolvedValue(
      buildCoupon({
        code: 'FIX200',
        discountType: CouponDiscountType.FIXED,
        discountValue: '200.00',
      }),
    );

    const response = await service.validateForPublicCheckout({
      code: 'FIX200',
      subtotal: 80,
    });

    expect(response.valid).toBe(true);
    expect(response.discountAmount).toBe('80.00');
    expect(response.finalSubtotal).toBe('0.00');
  });
});

