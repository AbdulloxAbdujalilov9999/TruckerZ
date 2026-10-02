import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const isLocal = (process.env.DATABASE_URL ?? "").includes("localhost");
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const BROKERS = ["Meridian Freight Systems", "Coastal Logistics", "Apex Brokerage", "Lonestar Transport", "Summit Freight"];
const CITIES: [string, string][] = [
  ["Chicago", "IL"],
  ["Dallas", "TX"],
  ["Atlanta", "GA"],
  ["Denver", "CO"],
  ["Phoenix", "AZ"],
  ["Columbus", "OH"],
  ["Memphis", "TN"],
  ["Charlotte", "NC"],
];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Seeding demo data…");

  const passwordHash = await bcrypt.hash("password123", 10);

  const company = await prisma.company.create({
    data: {
      name: "Righteous and Son INC",
      supportEmail: "support@truckerz.example",
      supportPhone: "321-555-0100",
    },
  });

  await prisma.user.create({
    data: {
      name: "Jordan Smith",
      email: "owner@truckerz.demo",
      passwordHash,
      role: "OWNER",
      companyId: company.id,
    },
  });

  const dispatcher = await prisma.user.create({
    data: {
      name: "Taylor Reyes",
      email: "dispatcher@truckerz.demo",
      passwordHash,
      role: "DISPATCHER",
      companyId: company.id,
      dispatchFeePercent: 5,
    },
  });

  await prisma.user.create({
    data: {
      name: "Morgan Lee",
      email: "office@truckerz.demo",
      passwordHash,
      role: "OFFICE",
      companyId: company.id,
    },
  });

  const driverPayPlans: { type: "PER_MILE" | "PERCENTAGE"; rate: number }[] = [
    { type: "PER_MILE", rate: 0.6 },
    { type: "PERCENTAGE", rate: 25 },
  ];

  const drivers = await Promise.all(
    ["Alex Carter", "Sam Patel", "Jordan Blake", "Casey Nguyen", "Drew Flores", "Riley Cox"].map(
      (name, i) =>
        prisma.user.create({
          data: {
            name,
            email: `driver${i + 1}@truckerz.demo`,
            passwordHash,
            role: "DRIVER",
            companyId: company.id,
            driverPayType: driverPayPlans[i % 2].type,
            driverPayRate: driverPayPlans[i % 2].rate,
          },
        })
    )
  );

  const fleetMain = await prisma.fleet.create({ data: { name: "Main Fleet", companyId: company.id } });
  const fleetRegional = await prisma.fleet.create({ data: { name: "Regional Fleet", companyId: company.id } });

  const truckStatuses: ("ACTIVE" | "IDLE" | "INACTIVE")[] = [
    "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "IDLE", "INACTIVE",
  ];
  const trucks = await Promise.all(
    truckStatuses.map((status, i) =>
      prisma.truck.create({
        data: {
          unitNumber: `FC-${String(i + 1).padStart(3, "0")}`,
          type: i % 2 === 0 ? "Dry Van" : "Reefer",
          status,
          fleetId: i < 4 ? fleetMain.id : fleetRegional.id,
          driverId: drivers[i % drivers.length].id,
        },
      })
    )
  );

  const statusWeights: ("BOOKED" | "IN_TRANSIT" | "DELIVERED" | "INVOICED" | "PAID")[] = [
    "PAID", "PAID", "PAID", "PAID", "PAID", "INVOICED", "INVOICED", "DELIVERED", "IN_TRANSIT", "BOOKED",
  ];

  for (let i = 0; i < 24; i++) {
    const truck = randomOf(trucks);
    const [originCity, originState] = randomOf(CITIES);
    let [destCity, destState] = randomOf(CITIES);
    while (destCity === originCity) [destCity, destState] = randomOf(CITIES);

    const miles = randomInt(250, 1400);
    const rate = +(miles * (2.0 + Math.random() * 0.8)).toFixed(2);
    const status = randomOf(statusWeights);
    const pickupDate = daysAgo(randomInt(0, 170));
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + randomInt(1, 3));

    const dispatchFeePercent = 5;
    const dispatchFeeAmount = +((rate * dispatchFeePercent) / 100).toFixed(2);

    const load = await prisma.load.create({
      data: {
        fleetId: truck.fleetId,
        truckId: truck.id,
        driverId: truck.driverId,
        loadNumber: `L-${1000 + i}`,
        status,
        originAddress: `${randomInt(100, 9999)} Main St`,
        originCity,
        originState,
        destinationAddress: `${randomInt(100, 9999)} Commerce Ave`,
        destinationCity: destCity,
        destinationState: destState,
        broker: randomOf(BROKERS),
        rate,
        miles,
        dispatchFeePercent,
        dispatchFeeAmount,
        deductions: 0,
        pickupDate,
        deliveryDate,
        createdById: dispatcher.id,
      },
    });

    if (["DELIVERED", "INVOICED", "PAID"].includes(status)) {
      const driver = drivers.find((d) => d.id === load.driverId);
      let driverFeeAmount = 0;
      if (driver?.driverPayType === "PER_MILE") driverFeeAmount = +(miles * Number(driver.driverPayRate)).toFixed(2);
      if (driver?.driverPayType === "PERCENTAGE") driverFeeAmount = +((rate * Number(driver.driverPayRate)) / 100).toFixed(2);

      await prisma.payment.create({
        data: {
          loadId: load.id,
          grossAmount: rate,
          fuelAmount: 0,
          driverFeeAmount,
          dispatcherEarning: dispatchFeeAmount,
          status: status === "PAID" ? "RECEIVED" : "PENDING",
          date: deliveryDate,
        },
      });
    }
  }

  const expenseCategories: ("FUEL" | "MAINTENANCE" | "INSURANCE" | "TOLLS" | "PERMITS_LICENSING")[] = [
    "FUEL", "MAINTENANCE", "INSURANCE", "TOLLS", "PERMITS_LICENSING",
  ];
  for (let i = 0; i < 20; i++) {
    await prisma.expense.create({
      data: {
        companyId: company.id,
        truckId: Math.random() > 0.3 ? randomOf(trucks).id : null,
        category: randomOf(expenseCategories),
        amount: +(randomInt(50, 1200) + Math.random()).toFixed(2),
        date: daysAgo(randomInt(0, 170)),
        description: null,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Owner login:      owner@truckerz.demo / password123");
  console.log("Dispatcher login: dispatcher@truckerz.demo / password123");
  console.log("Office login:     office@truckerz.demo / password123");
  console.log("Driver login:     driver1@truckerz.demo / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
